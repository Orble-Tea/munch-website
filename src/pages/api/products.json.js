export async function GET() {
  const retVal = {
    author: "Jaiman",
    message: "Hello World",
  };

  return new Response(JSON.stringify({ retVal }));
}
