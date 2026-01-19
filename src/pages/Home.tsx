import { Link } from 'react-router-dom'
import { showPages as pages } from '../router'
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Welcome to Invitation App
      </h1>
      <div>
        {pages.map(page => (
          <p>
            <Link key={page.path} to={page.path}>
              {page.name}
            </Link>
          </p>
        ))}
      </div>
    </div>
  )
}
