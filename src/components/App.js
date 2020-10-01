import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Chanoey from '../abis/Chanoey.json';
import Navbar from './Navbar';
import Main from './Main';

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }
  
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  } 

  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] }) 
    const networkId = await web3.eth.net.getId()
    const networkData = Chanoey.networks[networkId]
    if(networkData) {
      const chanoey = web3.eth.Contract(Chanoey.abi, networkData.address)
      this.setState({ chanoey })
      const productCount = await chanoey.methods.productCount().call()
      this.setState({ productCount })
      
      for (var i = 1; i <= productCount; i++) {
        const product = await chanoey.methods.products(i).call()
        this.setState({
          products: [...this.state.products, product]
        })
      }

      this.setState({ loading: false })
      console.log(this.state.products)
    } else {
      window.alert('TradeIt Marketplace contract not deployed to detected network.')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true
    }
    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }

  createProduct(name, price) {
    this.setState({ loading: true })
    this.state.chanoey.methods.createProduct(name, price).send({ from: this.state.account })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true })
    this.state.chanoey.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  render() {
    return (
      <div>
        <Navbar account = {this.state.account}/>
        <div className="container-fluid mt-5"> 
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              { this.state.loading
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
                : <Main 
                  products = { this.state.products }                  
                  createProduct = { this.createProduct } 
                  purchaseProduct = { this.purchaseProduct }/> 
              }   
            </main>
          </div>
        </div>      
      </div>
    );
  }
}

export default App;
