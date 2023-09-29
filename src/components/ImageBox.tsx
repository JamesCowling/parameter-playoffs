export function ImageBox({
  url,
  text,
  byline,
  onClick,
}: {
  url: string;
  text: string;
  byline: string;
  onClick: any;
}) {
  return (
    <div className="relative inline-block">
      <div className="group w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
        <img
          src={url}
          alt=""
          className="pointer-events-none object-cover group-hover:opacity-75"
        />
        <button
          type="button"
          className="absolute inset-0 focus:outline-none"
          onClick={onClick}
        >
          <span className="sr-only">View details for {text}</span>
        </button>
      </div>
      <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
        {text}
      </p>
      <p className="pointer-events-none block text-sm font-medium text-gray-500">
        {byline}
      </p>
    </div>
  );
}
