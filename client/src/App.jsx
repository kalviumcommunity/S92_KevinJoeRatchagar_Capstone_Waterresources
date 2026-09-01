import Header from './components/Header'
import Card from './components/Card'
import Button from './components/Button'
import './App.css'

function App() {
  const handleClick = () => {
    alert('Thank you for exploring Water Resources!')
  }

  return (
    <>
      <Header />

      <main>
        <h1>Water Resources Management</h1>
        <p>Learn about water conservation and sustainable water usage.</p>

        <div className="cards">
          <Card
            title="Water Conservation"
            description="Use water carefully and avoid unnecessary wastage."
          />

          <Card
            title="Rainwater Harvesting"
            description="Collect and store rainwater for future use."
          />

          <Card
            title="Clean Water"
            description="Protect water sources and maintain clean water for everyone."
          />
        </div>

        <Button
          text="Learn More"
          onClick={handleClick}
        />
      </main>
    </>
  )
}

export default App