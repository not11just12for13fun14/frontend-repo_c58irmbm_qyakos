import { useEffect, useState } from 'react'

function App() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    const load = async () => {
      try {
        // Try to fetch pizzas; if empty, seed then refetch
        const res = await fetch(`${baseUrl}/api/pizzas`)
        const data = await res.json()
        if (!data || data.length === 0) {
          await fetch(`${baseUrl}/api/pizzas/seed`, { method: 'POST' })
          const res2 = await fetch(`${baseUrl}/api/pizzas`)
          const data2 = await res2.json()
          setMenu(data2)
        } else {
          setMenu(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addToCart = (pizza, size) => {
    const price = size === 'small' ? pizza.price_small : size === 'medium' ? pizza.price_medium : pizza.price_large
    setCart(prev => {
      const existing = prev.find(i => i.pizza_id === pizza._id && i.size === size)
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { pizza_id: pizza._id, name: pizza.name, size, quantity: 1, unit_price: price }]
    })
  }

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const delivery = subtotal > 0 ? 3.5 : 0
  const total = subtotal + delivery

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const payload = {
        customer_name: 'Guest',
        customer_phone: '000-000-0000',
        customer_address: 'Pickup',
        items: cart,
        subtotal,
        delivery_fee: delivery,
        total,
        status: 'pending'
      }
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Order placed! ID: ${data.id}`)
        setCart([])
      } else {
        alert(data.detail || 'Failed to place order')
      }
    } catch (e) {
      alert('Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-rose-50">
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍕</span>
            <h1 className="text-2xl font-bold text-orange-600">Blue's Pizza</h1>
          </div>
          <div className="text-sm text-gray-700">
            Cart: <span className="font-semibold">{cart.reduce((s,i)=>s+i.quantity,0)}</span> items •
            <span className="ml-1 font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <section className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          {loading ? (
            <p className="text-gray-500">Loading menu...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menu.map(p => (
                <div key={p._id} className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden flex flex-col">
                  {p.image && <img src={p.image} alt={p.name} className="h-32 w-full object-cover" />}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{p.name}</h3>
                      {p.vegetarian && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Veg</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
                    <div className="mt-auto space-y-2">
                      <div className="text-sm text-gray-700">Small ${p.price_small.toFixed(2)}</div>
                      <div className="text-sm text-gray-700">Medium ${p.price_medium.toFixed(2)}</div>
                      <div className="text-sm text-gray-700">Large ${p.price_large.toFixed(2)}</div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => addToCart(p,'small')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded">Small</button>
                        <button onClick={() => addToCart(p,'medium')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded">Medium</button>
                        <button onClick={() => addToCart(p,'large')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded">Large</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside>
          <h2 className="text-xl font-semibold mb-4">Your Order</h2>
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4">
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty. Add some pizzas!</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{item.name} • {item.size}</div>
                      <div className="text-gray-500">${item.unit_price.toFixed(2)} × {item.quantity}</div>
                    </div>
                    <div className="font-semibold">${(item.unit_price*item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>${delivery.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                <button disabled={placing}
                  onClick={placeOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2 rounded">
                  {placing ? 'Placing order...' : 'Place Order'}
                </button>
                <a href="/test" className="block text-center text-xs text-gray-500 hover:underline">Check backend status</a>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">
        Built with ❤️ by Flames.Blue
      </footer>
    </div>
  )
}

export default App
