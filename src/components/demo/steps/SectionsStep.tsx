"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useDemoConfig, type SectionConfig } from "@/context/DemoConfigContext";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";

export function SectionsStep() {
  const C = useC();
  const { config, updateSections } = useDemoConfig();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = config.sections.findIndex((s) => s.id === active.id);
        const newIndex = config.sections.findIndex((s) => s.id === over.id);

        const newSections = arrayMove(config.sections, oldIndex, newIndex).map(
          (s, i) => ({ ...s, order: i })
        );
        updateSections(newSections);
      }
    },
    [config.sections, updateSections]
  );

  const handleLabelChange = useCallback(
    (id: string, label: string) => {
      const newSections = config.sections.map((s) =>
        s.id === id ? { ...s, label } : s
      );
      updateSections(newSections);
    },
    [config.sections, updateSections]
  );

  const handleCpToggle = useCallback(
    (id: string) => {
      const newSections = config.sections.map((s) =>
        s.id === id ? { ...s, cp: s.cp === 1 ? 2 : 1 } : s
      ) as SectionConfig[];
      updateSections(newSections);
    },
    [config.sections, updateSections]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (config.sections.length <= 3) return; // Minimum 3 sections
      const newSections = config.sections
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i }));
      updateSections(newSections);
    },
    [config.sections, updateSections]
  );

  const handleAdd = useCallback(() => {
    const newId = `section_${Date.now()}`;
    const newSections = [
      ...config.sections,
      {
        id: newId,
        label: "New Section",
        cp: 2 as const,
        order: config.sections.length,
      },
    ];
    updateSections(newSections);
  }, [config.sections, updateSections]);

  const cp1Count = config.sections.filter((s) => s.cp === 1).length;
  const cp2Count = config.sections.filter((s) => s.cp === 2).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: C.t1,
            marginBottom: 6,
          }}
        >
          Section Schema
        </h2>
        <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.5 }}>
          Define the sections members complete in your program. Drag to reorder,
          click labels to rename, toggle CP badges to change checkpoint
          assignment.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16 }}>
        <div
          style={{
            padding: "10px 14px",
            background: C.edge + "30",
            borderRadius: 6,
          }}
        >
          <span className="mono" style={{ fontSize: 10, color: C.t3 }}>
            CP1: {cp1Count} sections
          </span>
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: C.edge + "30",
            borderRadius: 6,
          }}
        >
          <span className="mono" style={{ fontSize: 10, color: C.t3 }}>
            CP2: {cp2Count} sections
          </span>
        </div>
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={config.sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {config.sections.map((section, index) => (
              <SortableItem
                key={section.id}
                section={section}
                index={index}
                onLabelChange={handleLabelChange}
                onCpToggle={handleCpToggle}
                onDelete={handleDelete}
                canDelete={config.sections.length > 3}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add button */}
      <Btn onClick={handleAdd} style={{ alignSelf: "flex-start" }}>
        + Add section
      </Btn>
    </div>
  );
}

// Sortable item component
type SortableItemProps = {
  section: SectionConfig;
  index: number;
  onLabelChange: (id: string, label: string) => void;
  onCpToggle: (id: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
};

function SortableItem({
  section,
  index,
  onLabelChange,
  onCpToggle,
  onDelete,
  canDelete,
}: SortableItemProps) {
  const C = useC();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleStartEdit = () => {
    setEditValue(section.label);
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    if (editValue.trim()) {
      onLabelChange(section.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEdit();
    } else if (e.key === "Escape") {
      setEditValue(section.label);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: C.bg,
        border: `1px solid ${C.edge}`,
        borderRadius: 8,
      }}
      whileHover={{ borderColor: C.t4 }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          padding: "4px",
          color: C.t4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div style={{ width: 12, height: 2, background: C.t4, borderRadius: 1 }} />
        <div style={{ width: 12, height: 2, background: C.t4, borderRadius: 1 }} />
      </div>

      {/* Index */}
      <span
        className="mono"
        style={{ fontSize: 10, color: C.t4, width: 16, textAlign: "center" }}
      >
        {index + 1}
      </span>

      {/* Label (editable) */}
      <div style={{ flex: 1 }}>
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: "100%",
              fontSize: 13,
              color: C.t1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: 0,
            }}
          />
        ) : (
          <button
            onClick={handleStartEdit}
            style={{
              fontSize: 13,
              color: C.t1,
              background: "none",
              border: "none",
              cursor: "text",
              textAlign: "left",
              padding: 0,
            }}
          >
            {section.label}
          </button>
        )}
      </div>

      {/* CP toggle */}
      <button
        onClick={() => onCpToggle(section.id)}
        className="mono"
        style={{
          fontSize: 9,
          padding: "4px 8px",
          borderRadius: 4,
          background: section.cp === 1 ? C.green + "20" : C.blue + "20",
          color: section.cp === 1 ? C.green : C.blue,
          border: "none",
          cursor: "pointer",
        }}
      >
        CP{section.cp}
      </button>

      {/* Delete button (shown on hover via CSS-in-JS won't work, so always show if canDelete) */}
      {canDelete && (
        <button
          onClick={() => onDelete(section.id)}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            color: C.t4,
            background: "none",
            border: "none",
            cursor: "pointer",
            opacity: 0.5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
            e.currentTarget.style.color = C.t4;
          }}
        >
          Remove
        </button>
      )}
    </motion.div>
  );
}
