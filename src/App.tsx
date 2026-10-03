import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ShopProvider } from "./context/ShopContext";
import { BookPage } from "./pages/BookPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ShopPage } from "./pages/ShopPage";

export default function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ShopPage />} />
            <Route path="books/:bookId" element={<BookPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ShopProvider>
  );
}
