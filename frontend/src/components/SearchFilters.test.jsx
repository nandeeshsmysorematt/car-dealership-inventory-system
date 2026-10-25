import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchFilters from './SearchFilters'

const emptyFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' }

describe('SearchFilters', () => {
  it('shows all filter fields and the Search and Clear buttons', () => {
    render(<SearchFilters onSearch={() => {}} />)
    for (const label of ['Make', 'Model', 'Category', 'Min price', 'Max price']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('submits the values that were typed', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchFilters onSearch={onSearch} />)
    await user.type(screen.getByLabelText('Make'), 'tata')
    await user.type(screen.getByLabelText('Category'), 'SUV')
    await user.type(screen.getByLabelText('Min price'), '500000')
    await user.type(screen.getByLabelText('Max price'), '1500000')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSearch).toHaveBeenCalledWith({
      make: 'tata',
      model: '',
      category: 'SUV',
      minPrice: '500000',
      maxPrice: '1500000',
    })
  })

  it('trims spaces around text filters', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchFilters onSearch={onSearch} />)
    await user.type(screen.getByLabelText('Model'), '  Nexon  ')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSearch).toHaveBeenCalledWith({ ...emptyFilters, model: 'Nexon' })
  })

  it('clears every field and searches with empty filters', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchFilters onSearch={onSearch} />)
    await user.type(screen.getByLabelText('Make'), 'tata')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByLabelText('Make')).toHaveValue('')
    expect(onSearch).toHaveBeenLastCalledWith(emptyFilters)
  })

  it('rejects a minimum price above the maximum price', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchFilters onSearch={onSearch} />)
    await user.type(screen.getByLabelText('Min price'), '900000')
    await user.type(screen.getByLabelText('Max price'), '500000')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Minimum price cannot be higher than maximum price',
    )
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('removes the error once the range is fixed', async () => {
    const user = userEvent.setup()
    render(<SearchFilters onSearch={() => {}} />)
    await user.type(screen.getByLabelText('Min price'), '900000')
    await user.type(screen.getByLabelText('Max price'), '500000')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await screen.findByRole('alert')
    await user.clear(screen.getByLabelText('Min price'))
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})