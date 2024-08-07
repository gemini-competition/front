const imageCards = [
  {
    key: 1,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-22T12:48:25.613",
    multiple: false,
  },
  {
    key: 2,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-23T12:48:25.613",
    multiple: true,
  },
  {
    key: 3,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-24T12:48:25.613",
    multiple: false,
  },
  {
    key: 4,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-25T12:48:25.613",
    multiple: false,
  },
  {
    key: 5,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-25T12:48:25.613",
    multiple: false,
  },
  {
    key: 6,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-25T12:48:25.613",
    multiple: false,
  },
  {
    key: 7,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-25T12:48:25.613",
    multiple: false,
  },
  {
    key: 8,
    image: "https://pbs.twimg.com/media/GGjuFyDbAAAOtOz.jpg",
    date: "2024-07-25T12:48:25.613",
    multiple: false,
  },
];

export default function Collection() {
  return (
    <div className="mx-auto grid grid-cols-3 gap-12 p-8 md:grid-cols-4 lg:grid-cols-5">
      {imageCards.length === 0 ? (
        <p>Your collection is empty</p>
      ) : (
        imageCards.map(({ key, ...imageCard }) => (
          <ImageCard key={key} {...imageCard} />
        ))
      )}
    </div>
  );
}

function ImageCard({
  image,
  date,
  multiple,
}: {
  image: string;
  date: string;
  multiple: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="overflow-clip rounded-lg drop-shadow">
          <img
            height="180px"
            width="180px"
            loading="lazy"
            src={image}
            alt="image"
            className="w-full bg-gray-400 bg-cover"
          />
          <div className="absolute inset-0 -z-10 animate-pulse overflow-clip rounded-lg bg-neutral-400"></div>
        </div>
        {multiple ? (
          <div className="absolute inset-0 -z-10 rotate-12 overflow-clip rounded-lg bg-neutral-600 drop-shadow"></div>
        ) : null}
      </div>

      <p className="text-center text-neutral-50">{formatDate(date)}</p>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toDateString();
}
