import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import formatValue from '../utils/formatValue';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  cartTotal: string;
  totalItensInCart: number;
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const dataProducts = await AsyncStorage.getItem('@GoMarketplace:cart');
      if (dataProducts) {
        setProducts(JSON.parse(dataProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@GoMarketplace:cart', JSON.stringify(products));
  }, [products]);

  const cartTotal = useMemo(() => {
    const total = products.reduce(
      (amount, product) => product.price * product.quantity + amount,
      0,
    );

    return formatValue(total);
  }, [products]);

  const totalItensInCart = useMemo(
    () => products.reduce((total, product) => total + product.quantity, 0),
    [products],
  );

  const addToCart = useCallback(
    product => {
      const cartProduct = products.find(p => p.id === product.id);

      if (cartProduct) {
        setProducts(
          products.map(p =>
            p.id === cartProduct.id ? { ...p, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [products],
  );

  const increment = useCallback(
    id => {
      const product = products.find(p => p.id === id);
      const newQuantity = product?.quantity ? product.quantity + 1 : 1;
      // verify stock
      setProducts(
        products.map(p => (p.id === id ? { ...p, quantity: newQuantity } : p)),
      );
    },
    [products],
  );

  const decrement = useCallback(
    id => {
      const product = products.find(p => p.id === id);
      const newQuantity = product?.quantity ? product.quantity - 1 : 0;
      if (!newQuantity) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        setProducts(
          products.map(p =>
            p.id === id ? { ...p, quantity: newQuantity } : p,
          ),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      cartTotal,
      totalItensInCart,
    }),
    [addToCart, increment, decrement, products, cartTotal, totalItensInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
