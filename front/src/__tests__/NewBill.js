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
import { bills } from "../fixtures/bills.js"
import Bills from '../containers/Bills'
import userEvent from '@testing-library/user-event'
import { TestScheduler } from 'jest'
import test from 'node:test'


jest.mock("../app/store", () => mockStore)

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
window.localStorage.setItem('user', JSON.stringify({
  type: 'Employee'
}))
const root = document.createElement("div")
root.setAttribute("id", "root")
document.body.append(root)
router()
// const onNavigate = (pathname) => {
//   document.body.innerHTML = ROUTES({ pathname });
// };
window.onNavigate(ROUTES_PATH.NewBill)

describe("Given I am a user connected as employee", () => {
  describe("When i'm on new bill page", () => {
    //est-on bien sur la page new bill ?
    test('Then new Bill page should be displayed', async () => {
      await waitFor(() => screen.getByText("Envoyer une note de frais"))
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
      
    })

    describe('when i try to submit the form', () => {
      //evenement submit possible ?
      test('Then submit event should be called', async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})

        const handleSubmit = jest.fn(() => billNew.handleSubmit)
        const submitButton = document.querySelector('#btn-send-bill')
        
        submitButton.addEventListener('click', handleSubmit)
        userEvent.click(submitButton)
        
        expect(handleSubmit).toHaveBeenCalled()
      })
      //test validité des champs
      test('then inputs should be valid', async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        jest.clearAllMocks()

        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const date = screen.getByTestId('datepicker')
        const amount = screen.getByTestId('amount')
        const pct = screen.getByTestId('pct')
        const formSubmit = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn(() => billNew.handleSubmit)
        const submitButton = document.querySelector('#btn-send-bill')

        fireEvent.change(date, {target: {value:'2025-01-01'}})
        fireEvent.change(amount, {target: {value:'220'}})
        fireEvent.change(pct, {target: {value:'10'}})
        
        
        submitButton.addEventListener('click', handleSubmit)
        userEvent.click(submitButton)
        
        expect(handleSubmit).toHaveBeenCalled()
        expect(date.validity.valid).toBeTruthy()
        expect(amount.validity.valid).toBeTruthy()
        expect(pct.validity.valid).toBeTruthy()
      })
      //test validité des champs avec des champs vides et des champs incorrects
      test('then inputs should not be valid', async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        jest.clearAllMocks()

        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const date = screen.getByTestId('datepicker')
        const amount = screen.getByTestId('amount')
        const pct = screen.getByTestId('pct')
        const formSubmit = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn(() => billNew.handleSubmit)
        const submitButton = document.querySelector('#btn-send-bill')

        fireEvent.change(date, {target: {value:'Salade'}})
        fireEvent.change(amount, {target: {value:'Tomate'}})
        fireEvent.change(pct, {target: {value:'Oignons'}})
        
        
        submitButton.addEventListener('click', handleSubmit)
        userEvent.click(submitButton)
        
        
        expect(date.validity.valid).not.toBeTruthy()
        expect(amount.validity.valid).not.toBeTruthy()
        expect(pct.validity.valid).not.toBeTruthy()

        fireEvent.change(date, {target: {value:''}})
        fireEvent.change(amount, {target: {value:''}})
        fireEvent.change(pct, {target: {value:''}})

        userEvent.click(submitButton)

        expect(handleSubmit.mock.calls.length).toEqual(2)
        expect(date.validity.valid).not.toBeTruthy()
        expect(amount.validity.valid).not.toBeTruthy()
        expect(pct.validity.valid).not.toBeTruthy()
      })
    })
    
    
    describe('when i try to change the file', () => {
      //peut-on rentrer un fichier avec un format incorrect ?
      test('Then input a file with incorrect format should remove the file', async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const file = screen.getByTestId('file')
        const newFile = new File(['image.pdf'], 'une-image.pdf' , { type: "image/pdf"})

        const alerting = jest.spyOn(window, "alert").mockImplementation(() => {});
        const handleChangeFile = jest.fn(() => billNew.handleChangeFile);

        document.querySelector('input[type=file]').addEventListener('change', handleChangeFile )
        userEvent.upload(file , newFile)

        //expect(handleChangeFile).toHaveBeenCalled()
        expect(alerting).toBeCalledWith("Le type de fichier saisi n'est pas correct")
        expect(file.files).toBeNull()
      })
      //input with a valid file
      test('Then input a file with correct format should keep the file and then call create method', async () => {
        jest.clearAllMocks()
        window.onNavigate(ROUTES_PATH.NewBill)
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const file = screen.getByTestId('file')
        const newFile = new File(['image.jpg'], 'une-image.jpg' , { type: "image/jpeg"})

        const spyCreate = jest.spyOn(mockStore.bills(), 'create')
        const alerting = jest.spyOn(window, "alert").mockImplementation(() => {});
        const handleChangeFile = jest.fn(() => billNew.handleChangeFile);

        document.querySelector('input[type=file]').addEventListener('change', handleChangeFile )
        userEvent.upload(file , newFile)
        
        expect(spyCreate).toHaveBeenCalled()

        //expect(handleChangeFile).toHaveBeenCalled()
        expect(file.files).not.toBeNull()
        expect(file.files[0]).toStrictEqual(newFile)
      })
      
    })

    describe('when i submit form with good value', () => {
      test('then it should call the update method', async () => {
        jest.clearAllMocks()
        window.onNavigate(ROUTES_PATH.NewBill)
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        const file = screen.getByTestId('file')
        const newFile = new File(['image.jpg'], 'une-image.jpg' , { type: "image/jpeg"})

        const spyUpdate = jest.spyOn(mockStore.bills(), 'update')
        const spyCreate = jest.spyOn(mockStore.bills(), 'create')

        //on ajout un bon fichier et on regarde si la fonction est bien appellée
        const handleChangeFile = jest.fn(() => billNew.handleChangeFile);
        document.querySelector('input[type=file]').addEventListener('change', handleChangeFile )
        userEvent.upload(file , newFile)
        expect(spyCreate).toHaveBeenCalled()

        //on submit le formulaire
        const handleSubmit = jest.fn(() => billNew.handleSubmit)
        const submitButton = document.querySelector('#btn-send-bill')
        submitButton.addEventListener('click', handleSubmit)
        userEvent.click(submitButton)

        expect(spyUpdate).toHaveBeenCalled()
        // expect(spyUpdate.mock.calls[0]).toEqual('yeah')
      })
      test('it should render Bills page', async () => {
        await waitFor(() => screen.getByText("Mes notes de frais"))
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      })
      test.only('test ahah', async () => {
        jest.clearAllMocks()
        window.onNavigate(ROUTES_PATH.NewBill)
        const billNew = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
        expect(1).toBe(2)

      })
    })
    describe('when i call create function', () => {
      test('it should return correct value', async () => {
        mockStore.bills().create().then(value => {
          expect(value.fileUrl).toBe('https://localhost:3456/images/test.jpg')
          expect(value.key).toBe('1234')
        })
      })
    })
    describe('when i call update function', () => {
      test('it should return correct value', async () => {
        const expectedData = {
          "id": "47qAXb6fIm2zOKkLzMro",
          "vat": "80",
          "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          "status": "pending",
          "type": "Hôtel et logement",
          "commentary": "séminaire billed",
          "name": "encore",
          "fileName": "preview-facture-free-201801-pdf-1.jpg",
          "date": "2004-04-04",
          "amount": 400,
          "commentAdmin": "ok",
          "email": "a@a",
          "pct": 20
        }
        mockStore.bills().update().then(value => {
          expect(value.id).toBe(expectedData.id)
          expect(value.name).toBe(expectedData.name)
        })
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
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        document.body.innerHTML = (ROUTES({ pathname: ROUTES_PATH['Bills'], error: "Erreur 404"}))
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches bills from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
        document.body.innerHTML = (ROUTES({ pathname: ROUTES_PATH['Bills'], error: "Erreur 500"}))
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
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