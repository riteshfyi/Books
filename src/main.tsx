import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { useAppStore } from './store/useAppStore'
import Layout from './components/Layout'
import HomeView from './views/HomeView'
import BookDetailView from './views/BookDetailView'
import EditBookView from './views/EditBookView'
import CollectionsView from './views/CollectionsView'
import SettingsView from './views/SettingsView'

function App() {
  const { loadData, handlePageAdded, setActiveBook } = useAppStore()

  React.useEffect(() => {
    loadData()
    const u1 = window.booksAPI.onPageAdded((bookId, page) => handlePageAdded(bookId, page))
    const u2 = window.booksAPI.onActiveBookChanged(() => loadData())
    const u3 = window.booksAPI.onNoActiveBook(() => {})
    const u4 = window.booksAPI.onBookCreated(() => loadData())
    return () => { u1(); u2(); u3(); u4() }
  }, [])

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/book/:bookId" element={<BookDetailView />} />
          <Route path="/book/:bookId/edit" element={<EditBookView />} />
          <Route path="/collections" element={<CollectionsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
