import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.goodFileType = false
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    e.stopImmediatePropagation()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const fileName = file.name
    const ext = fileName.split('.')[1]
    const fileFormat = ['jpg', 'jpeg', "png"]
    if(!fileFormat.includes(ext)){
      console.log('ERREUR, fichier incorrect')
      this.goodFileType = false
      this.document.querySelector(`input[data-testid="file"]`).value = '';
      this.document.querySelector(`input[data-testid="file"]`).files = null;
      // const dt = new DataTransfer();
      // this.document.querySelector(`input[data-testid="file"]`).files = dt.files
      alert("Le type de fichier saisi n'est pas correct")
      return
    } else {
      this.goodFileType = true
    }
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)
      this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        console.log(key)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
  }
  handleSubmit = e => {
    e.preventDefault()
    e.stopImmediatePropagation()
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: this.document.querySelector(`select[data-testid="expense-type"]`).value,
      name:  this.document.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(this.document.querySelector(`input[data-testid="amount"]`).value),
      date:  this.document.querySelector(`input[data-testid="datepicker"]`).value,
      vat: this.document.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(this.document.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: this.document.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
        if (this.store) {
          this.store
          .bills()
          .update({data: JSON.stringify(bill), selector: this.billId})
          .then(() => {
            console.log('update effectué: ', bill)
            this.onNavigate(ROUTES_PATH['Bills'])
          })
          .catch(error => console.error(error))
        }
  }
}