import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans h-screen text-gray-900">
      <Image
        src="/logo.png"
        alt="Logo"
        width={200}
        height={200}
        className="mb-4"
      />
      <h1 className="text-3xl font-bold">
        Welcome to the AI Assignment Generator
      </h1>
    </div>
  );
}
