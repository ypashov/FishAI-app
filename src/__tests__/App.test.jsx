import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('App shell', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /upload/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /results/i })).toBeInTheDocument()
  })
})
