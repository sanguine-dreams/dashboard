import { IMAGE_TAGS } from '../api/client';

export const TagSelector = ({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (tags: number[]) => void;
}) => {
  const toggle = (tag: number) =>
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);

  return (
    <div className="flex flex-wrap gap-2">
      {IMAGE_TAGS.map((name, tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            aria-pressed={active}
            className={`px-3 py-1 rounded-full text-sm border transition ${
              active
                ? 'bg-rustic-green text-white border-rustic-green'
                : 'bg-white text-rustic-brown border-nude-300 hover:bg-nude-100'
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
};
