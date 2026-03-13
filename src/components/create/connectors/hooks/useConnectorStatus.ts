"use client";

import { useEffect, useState } from "react";
import type { InputConnector, OutputConnector } from "../types";

const INITIAL_INPUTS: InputConnector[] = [
  { id: "gmail", provider: "gmail", status: "connected", lastSync: "2m ago", itemsQueued: 3, autoIngest: false, accountLabel: "sarah@client.com", targetRoom: "meetings" },
  { id: "outlook", provider: "outlook", status: "disconnected", itemsQueued: 0, autoIngest: false, targetRoom: "meetings" },
  { id: "slack", provider: "slack", status: "syncing", lastSync: "just now", itemsQueued: 2, autoIngest: true, accountLabel: "#project-northstar", targetRoom: "discovery" },
  { id: "discord", provider: "discord", status: "disconnected", itemsQueued: 0, autoIngest: false, targetRoom: "discovery" },
  { id: "zoom", provider: "zoom", status: "connected", lastSync: "11m ago", itemsQueued: 1, autoIngest: false, accountLabel: "Steering Committee", targetRoom: "meetings" },
  { id: "manual", provider: "manual", status: "connected", lastSync: "drop ready", itemsQueued: 0, autoIngest: false, accountLabel: "paste, docs, urls", targetRoom: "user-selected" },
];

const INITIAL_OUTPUTS: OutputConnector[] = [
  { id: "claude", target: "claude", format: "xml", action: "copy", includeRooms: ["scope", "decisions", "outcomes", "meetings"], maskClient: false },
  { id: "chatgpt", target: "chatgpt", format: "markdown", action: "copy", includeRooms: ["scope", "decisions", "outcomes", "meetings"], maskClient: false },
  { id: "cursor", target: "cursor", format: "rules", action: "download", includeRooms: ["scope", "decisions", "risks"], maskClient: false },
  { id: "windsurf", target: "windsurf", format: "rules", action: "download", includeRooms: ["scope", "decisions", "risks"], maskClient: false },
  { id: "cline", target: "cline", format: "rules", action: "download", includeRooms: ["scope", "decisions", "risks"], maskClient: false },
  { id: "mcp", target: "mcp", format: "json", action: "serve", includeRooms: ["scope", "decisions", "outcomes", "meetings"], maskClient: false },
  { id: "resume", target: "resume", format: "html", action: "download", includeRooms: ["scope", "outcomes", "deliverables"], maskClient: true },
  { id: "portal", target: "portal", format: "url", action: "open", includeRooms: ["scope", "decisions", "deliverables", "outcomes", "meetings"], maskClient: false },
];

export function useConnectorStatus() {
  const [inputs, setInputs] = useState<InputConnector[]>(INITIAL_INPUTS);
  const [outputs] = useState<OutputConnector[]>(INITIAL_OUTPUTS);
  const [activeInput, setActiveInput] = useState<string>("slack");
  const [activeOutput, setActiveOutput] = useState<string>("claude");

  useEffect(() => {
    const id = setInterval(() => {
      setActiveOutput((current) => {
        const index = outputs.findIndex((item) => item.id === current);
        return outputs[(index + 1) % outputs.length]?.id ?? outputs[0].id;
      });
    }, 3200);

    return () => clearInterval(id);
  }, [outputs]);

  const connectInput = (id: string) => {
    setInputs((current) =>
      current.map((input) => (
        input.id === id
          ? { ...input, status: input.status === "disconnected" ? "connecting" : input.status }
          : input
      )),
    );

    window.setTimeout(() => {
      setInputs((current) =>
        current.map((input) => (
          input.id === id
            ? {
                ...input,
                status: "connected",
                lastSync: "just now",
                accountLabel: input.accountLabel ?? `${input.provider}.connected`,
              }
            : input
        )),
      );
    }, 900);
  };

  const syncInput = (id: string) => {
    setActiveInput(id);
    setInputs((current) =>
      current.map((input) => (
        input.id === id
          ? { ...input, status: "syncing", lastSync: "syncing…" }
          : input
      )),
    );

    window.setTimeout(() => {
      setInputs((current) =>
        current.map((input) => (
          input.id === id
            ? {
                ...input,
                status: "connected",
                lastSync: "just now",
                itemsQueued: input.itemsQueued + (input.provider === "zoom" ? 1 : 2),
              }
            : input
        )),
      );
    }, 1200);
  };

  const toggleAutoIngest = (id: string) => {
    setInputs((current) =>
      current.map((input) => (
        input.id === id ? { ...input, autoIngest: !input.autoIngest } : input
      )),
    );
  };

  return {
    inputs,
    outputs,
    activeInput,
    activeOutput,
    setActiveInput,
    setActiveOutput,
    connectInput,
    syncInput,
    toggleAutoIngest,
  };
}
