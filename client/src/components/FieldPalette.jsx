export default function FieldPalette({ fieldTypes = [], onDragStart }) {
  const handleDragStart = onDragStart || (() => {});

  return (
    <div className="field-list">
      {fieldTypes.map((field) => (
        <div
          key={field.type}
          className="field-tile"
          draggable
          onDragStart={(event) => handleDragStart(event, field.type)}
        >
          <span>{field.label}</span>
          <span className="field-pill">Drag</span>
        </div>
      ))}
    </div>
  );
}
