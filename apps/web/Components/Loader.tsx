export const Loader = ({ fullScreen = true }) => {
  const base =
    "border-4 border-blue-500 border-t-transparent rounded-full animate-spin";

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`h-8 w-8 ${base}`}></div>
      </div>
    );
  }

  return <div className={`h-6 w-6 ${base}`}></div>;
};