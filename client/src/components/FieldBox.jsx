import { Rnd } from "react-rnd";
import { denormalizeBox, normalizeBox } from "../utils/coords";

const MIN_WIDTH = 48;
const MIN_HEIGHT = 24;

export default function FieldBox({
  field,
  container,
  onChange,
  onRemove,
  onSelect,
  isSelected,
  children,
}) {
  const boxPx = denormalizeBox(field, container);

  const handleDragStop = (event, data) => {
    const next = normalizeBox(
      { x: data.x, y: data.y, width: boxPx.width, height: boxPx.height },
      container
    );
    onChange(field.id, next);
  };

  const handleResizeStop = (event, direction, ref, delta, position) => {
    const next = normalizeBox(
      {
        x: position.x,
        y: position.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      },
      container
    );
    onChange(field.id, next);
  };

  return (
    <Rnd
      size={{ width: boxPx.width, height: boxPx.height }}
      position={{ x: boxPx.x, y: boxPx.y }}
      bounds="parent"
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      dragHandleClassName="field-handle"
      className={`field-box ${isSelected ? "selected" : ""}`}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => onSelect(field.id)}
    >
      <div className="field-handle">
        <span className="field-label">{field.type}</span>
        <button
          type="button"
          className="field-delete"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(field.id);
          }}
        >
          ×
        </button>
      </div>
      <div className="field-body">{children}</div>
    </Rnd>
  );
}
