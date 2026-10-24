import { createBrowserRouter } from "react-router-dom";
import Login from "../containers/Login";
import Admin from "../containers/Admin";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Login />
    },
    {
        path: '/admin',
        element: <Admin />
    }
])