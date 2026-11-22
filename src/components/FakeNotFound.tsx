import { useEffect } from "react";

/**
 * Plain "404 page not found" screen with no Versatile branding. Shown to visitors while the
 * developer has the fake-404 switch on. Fixed colours so it never follows the store theme.
 */
export function FakeNotFound() {
  useEffect(() => {
    const prev = document.title;
    document.title = "404: This page could not be found";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <main
      className="min-h-screen bg-white text-black flex items-center justify-center px-6"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
    >
      <div className="flex items-center">
        <h1
          className="pr-6 mr-5 text-[24px] font-medium leading-[49px] border-r"
          style={{ borderColor: "rgba(0,0,0,.3)" }}
        >
          404
        </h1>
        <h2 className="text-[14px] font-normal leading-[49px]">This page could not be found.</h2>
      </div>
    </main>
  );
}
