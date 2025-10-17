import ReactDOM, { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Pizza from "./Pizza";
import React from 'react'

function App() {
    return (
        <div>
            <h1>Hello World</h1>
            <p>This is a pizza widget</p>
        </div>
    );
}

function PizzaListRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/index.html" element={<Pizza />} />
                <Route path="pizza" element={<Pizza />} />
            </Routes>
        </BrowserRouter>
    );
}

const container = document.getElementById("pizzaz-root");

console.log(container)

createRoot(container).render(<PizzaListRouter />);