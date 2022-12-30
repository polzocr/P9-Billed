/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import {fireEvent, getByAltText, getByTestId, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import router from "../app/Router"
import userEvent from '@testing-library/user-event'

//mocking
jest.mock("../app/store", () => mockStore)

//initialisation
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
window.localStorage.setItem('user', JSON.stringify({
  type: 'Employee',
  email: 'employee@test.tld'
}))
const root = document.createElement("div")
root.setAttribute("id", "root")
document.body.append(root)
router()
window.onNavigate(ROUTES_PATH.NewBill)

describe("Given I am a user connected as employee", () => {
  describe("When i'm on new bill page", () => {
    //are we on new bill page?
    test('Then new Bill page should be displayed', async () => {
      await waitFor(() => screen.getByText("Envoyer une note de frais"))
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()      
    })   
    
    describe('when i try to change the file', () => {
      //can we input incorrect file ?
      test('Then input a file with incorrect format should remove the file', async () => {
        //create the view and the instance of NewBill
        document.body.innerHTML = NewBillUI()
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const fileInput = screen.getByTestId('file')
        const newFile = new File(['image.pdf'], 'une-image.pdf' , { type: "image/pdf"})

        //spying the alert box and create function
        const alerting = jest.spyOn(window, "alert").mockImplementation(() => {});
        const spyCreate = jest.spyOn(mockStore.bills(), 'create')
        
        //adding event
        fileInput.addEventListener('change', billNew.handleChangeFile )
        userEvent.upload(fileInput , newFile)
        await new Promise(process.nextTick);

        
        expect(alerting).toBeCalledWith("Le type de fichier saisi n'est pas correct")

        //wrong file type does not call create method
        expect(billNew.goodFileType).toEqual(false)
        expect(billNew.fileUrl).toBeNull()
        expect(billNew.billId).toBeNull()
        expect(fileInput.files).toBeNull()
        expect(spyCreate).not.toHaveBeenCalled()
      })
      //input with a valid file
      test('Then input a file with correct format should keep the file and then call create method', async () => {
        jest.clearAllMocks()
        document.body.innerHTML = NewBillUI()

        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const fileInput = screen.getByTestId('file')
        const newFile = new File(['image.jpg'], 'une-image.jpg' , { type: "image/jpeg"})

        const spyCreate = jest.spyOn(mockStore.bills(), 'create')
        const spyUpdate = jest.spyOn(mockStore.bills(), 'update')
        const alerting = jest.spyOn(window, "alert").mockImplementation(() => {});
        

        fileInput.addEventListener('change', billNew.handleChangeFile )
        userEvent.upload(fileInput , newFile)
        await new Promise(process.nextTick);

        
        expect(alerting).not.toBeCalledWith("Le type de fichier saisi n'est pas correct")
        expect(spyUpdate).not.toHaveBeenCalled()
        expect(spyCreate).toHaveBeenCalled()

        //responses of create method
        expect(billNew.fileUrl).toEqual('https://localhost:3456/images/test.jpg')
        expect(billNew.billId).toEqual('1234')
        expect(billNew.fileName).toEqual('une-image.jpg')

        //keeping the file
        expect(billNew.goodFileType).toBeTruthy()
        expect(fileInput.files).not.toBeNull()
        expect(fileInput.files[0]).toStrictEqual(newFile)
      })
    })

    describe('when i submit form with good value', () => {
      test('then it should call the update method', async () => {
        jest.clearAllMocks()
        document.body.innerHTML = NewBillUI()

        //creating onNavigate for redirecting after update method
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const date = screen.getByTestId('datepicker')
        const amount = screen.getByTestId('amount')
        const pct = screen.getByTestId('pct')
        const file = screen.getByTestId('file')
        const newFile = new File(['image.jpg'], 'une-image.jpg' , { type: "image/jpeg"})
        const name = screen.getByTestId('expense-name')
        const vat = screen.getByTestId('vat')
        const commentary = screen.getByTestId('commentary')
        
        const formSubmit = screen.getByTestId('form-new-bill')
        const submitButton = document.querySelector('#btn-send-bill')
       
        const spyUpdate = jest.spyOn(mockStore.bills(), 'update')
        const spyCreate = jest.spyOn(mockStore.bills(), 'create')

        
        //filing form
        fireEvent.change(commentary, {target: {value:'Voila un long et important commentaire'}})
        fireEvent.change(name, {target: {value:'Tres grosse dépense'}})
        fireEvent.change(vat, {target: {value:'200'}})
        fireEvent.change(date, {target: {value:'2021-01-01'}})
        fireEvent.change(amount, {target: {value:'220'}})
        fireEvent.change(pct, {target: {value:'10'}})

        file.addEventListener('change', billNew.handleChangeFile)
        userEvent.upload(file , newFile)
        await new Promise(process.nextTick);

        submitButton.addEventListener('click', billNew.handleSubmit)
        userEvent.click(submitButton)
        await new Promise(process.nextTick);

        
        
        expect(spyCreate).toHaveBeenCalled()
        expect(billNew.fileUrl).toEqual('https://localhost:3456/images/test.jpg')
        expect(billNew.billId).toEqual('1234')
        
        //update method call with good values ?
        expect(spyUpdate).toHaveBeenCalled()
        expect(spyUpdate).toBeCalledWith({"data": "{\"email\":\"employee@test.tld\",\"type\":\"Transports\",\"name\":\"Tres grosse dépense\",\"amount\":220,\"date\":\"2021-01-01\",\"vat\":\"200\",\"pct\":10,\"commentary\":\"Voila un long et important commentaire\",\"fileUrl\":\"https://localhost:3456/images/test.jpg\",\"fileName\":\"une-image.jpg\",\"status\":\"pending\"}", "selector": "1234"})
      })
      test('it should render Bills page', async () => {
        await waitFor(() => screen.getByText("Mes notes de frais"))
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      })
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
      })
      test("submit form and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        document.body.innerHTML = NewBillUI()
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const date = screen.getByTestId('datepicker')
        const amount = screen.getByTestId('amount')
        const pct = screen.getByTestId('pct')
        const file = screen.getByTestId('file')
        const submitButton = document.querySelector('#btn-send-bill')
        const newFile = new File(['image.jpg'], 'une-image.jpg' , { type: "image/jpeg"})
        const spyUpdate = jest.spyOn(mockStore.bills(), 'update')

        fireEvent.change(date, {target: {value:'Salade'}})
        fireEvent.change(amount, {target: {value:'Tomate'}})
        fireEvent.change(pct, {target: {value:'Oignons'}})

        file.addEventListener('change', billNew.handleChangeFile)
        userEvent.upload(file , newFile)
        await new Promise(process.nextTick);

        submitButton.addEventListener('click', billNew.handleSubmit)
        userEvent.click(submitButton)
        await new Promise(process.nextTick);

        expect(spyUpdate).rejects.toEqual(new Error("Erreur 404"))
      })
      test("fetches bills from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
        document.body.innerHTML = NewBillUI()
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const date = screen.getByTestId('datepicker')
        const amount = screen.getByTestId('amount')
        const pct = screen.getByTestId('pct')
        const file = screen.getByTestId('file')
        const submitButton = document.querySelector('#btn-send-bill')
        const newFile = new File(['image.jpg'], 'une-image.jpg' , { type: "image/jpeg"})
        const spyUpdate = jest.spyOn(mockStore.bills(), 'update')

        fireEvent.change(date, {target: {value:'Salade'}})
        fireEvent.change(amount, {target: {value:'Tomate'}})
        fireEvent.change(pct, {target: {value:'Oignons'}})

        file.addEventListener('change', billNew.handleChangeFile)
        userEvent.upload(file , newFile)
        await new Promise(process.nextTick);

        submitButton.addEventListener('click', billNew.handleSubmit)
        userEvent.click(submitButton)
        await new Promise(process.nextTick);

        expect(spyUpdate).rejects.toEqual(new Error("Erreur 500"))
      })
  })
    
    
  })
})

//test POST
// describe("Given I am a user connected as employee", () => {
//   describe("When I create a new bill with POST", () => {
//     test("new bill is added", async () => {
//       localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a"}));
//       const root = document.createElement("div")
//       root.setAttribute("id", "root")
//       document.body.append(root)
//       router()
//       window.onNavigate(ROUTES_PATH.NewBill)
//       await waitFor(() => screen.getByText("Envoyer une note de frais"))

//       const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})

//       const date = screen.getByTestId('datepicker')
//       const amount = screen.getByTestId('amount')
//       const vat = screen.getByTestId('vat')
//       const pct = screen.getByTestId('pct')
//       const file = screen.getByTestId('file')
//       const formSubmit = screen.getByTestId('form-new-bill')

//       fireEvent.change(date, {target: {value:'2025-01-01'}})
//       fireEvent.change(amount, {target: {value:'220'}})
//       fireEvent.change(vat, {target: {value:'50'}})
//       fireEvent.change(pct, {target: {value:'10'}})

//     // fireEvent.change(file, {target: {files: [new File(['image.jpg'], 'C:\\fakepath\\harass.jpg', { type: 'image/jpeg' })]}})
//     // fireEvent.submit(formSubmit)
//     // await waitFor(() => screen.getByText("Nouvelle note de frais"))
//     // console.log(await mockStore.bills().list())

//       const mockSpy = jest.spyOn(mockStore, 'bills')
    
    
//       const handleChangeFile = jest.fn(newBill.handleChangeFile);
//       const newFile = new File(['image.jpg'], 'C:\\fakepath\\une-image.jpg' , { type: "image.jpeg}"})
//       file.addEventListener("change", handleChangeFile);
//       //fireEvent.change(file,newFile)
//       userEvent.upload(file ,newFile)
//       expect(screen.getByTestId('file').files[0].name).toBe('C:\\fakepath\\une-image.jpg')

      
      

//     // newBill.fileUrl = 'https://test.storage.tld/v0/b/billable-677b6.a…dur.jpg?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3'
//     // newBill.fileName = "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.jpg"
//       const handleSubmit = jest.fn(newBill.handleSubmit);
//       formSubmit.addEventListener("submit", handleSubmit);
//       fireEvent.submit(formSubmit)
//       await waitFor(() => screen.getByText("Mes notes de frais"))
//       expect(screen.getByTestId('btn-new-bill')).toHaveTextContent('Nouvelle note de frais')

//       expect(mockSpy).toHaveBeenCalled()
//       //expect(handleSubmit).toBeCalled()
//       //expect(createBill).toHaveBeenCalled()

    
//     })
  
//   describe("When an error occurs on API", () => {
//     beforeEach(() => {
//       jest.spyOn(mockStore, "bills")
//       Object.defineProperty(
//           window,
//           'localStorage',
//           { value: localStorageMock }
//       )
//       window.localStorage.setItem('user', JSON.stringify({
//         type: 'Employee'
//       }))
//       const root = document.createElement("div")
//       root.setAttribute("id", "root")
//       document.body.appendChild(root)
//       router()
//       window.onNavigate(ROUTES_PATH.NewBill)
//     })
//     test("fetches bills from an API and fails with 404 message error", async () => {

//       mockStore.bills.mockImplementationOnce(() => {
//         return {
//           create : () =>  {
//             return Promise.reject(new Error("Erreur 404"))
//           }
//         }})
//       document.body.innerHTML = (ROUTES({ pathname: ROUTES_PATH['Bills'], error: "Erreur 404"}))
//       await new Promise(process.nextTick);
//       const message = await screen.getByText(/Erreur 404/)
//       expect(message).toBeTruthy()
//     })
//     test("fetches bills from an API and fails with 500 message error", async () => {

//       mockStore.bills.mockImplementationOnce(() => {
//         return {
//           create : () =>  {
//             return Promise.reject(new Error("Erreur 500"))
//           }
//         }})
//       document.body.innerHTML = (ROUTES({ pathname: ROUTES_PATH['Bills'], error: "Erreur 500"}))
//       await new Promise(process.nextTick);
//       const message = await screen.getByText(/Erreur 500/)
//       expect(message).toBeTruthy()
//     })
    

    
//   })
//   })
// })