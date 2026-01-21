import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import Radio from "./components/Radio";

function App() {
  return (
    <>
      <Radio />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
