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


jest.mock("../app/store", () => mockStore)

// describe("Given I am connected as an employee", () => {
//   describe("When I am on NewBill Page", () => {
//     test("Then ...", () => {
//       const html = NewBillUI()
//       document.body.innerHTML = html
//       //to-do write assertion
//     })
//   })
// })

//test POST
describe("Given I am a user connected as employee", () => {
  describe("When I create a new bill with POST", () => {
    test("new bill is added", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a"}));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByText("Envoyer une note de frais"))

      const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})

      const date = screen.getByTestId('datepicker')
      const amount = screen.getByTestId('amount')
      const vat = screen.getByTestId('vat')
      const pct = screen.getByTestId('pct')
      const file = screen.getByTestId('file')
      const formSubmit = screen.getByTestId('form-new-bill')

      fireEvent.change(date, {target: {value:'2025-01-01'}})
      fireEvent.change(amount, {target: {value:'220'}})
      fireEvent.change(vat, {target: {value:'50'}})
      fireEvent.change(pct, {target: {value:'10'}})

    // fireEvent.change(file, {target: {files: [new File(['image.jpg'], 'C:\\fakepath\\harass.jpg', { type: 'image/jpeg' })]}})
    // fireEvent.submit(formSubmit)
    // await waitFor(() => screen.getByText("Nouvelle note de frais"))
    // console.log(await mockStore.bills().list())

      const mockSpy = jest.spyOn(mockStore, 'bills')
    
    
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const newFile = new File(['image.jpg'], 'C:\\fakepath\\harass.jpg' , { type: "image.jpeg}"})
      file.addEventListener("change", handleChangeFile);
      //fireEvent.change(file,newFile)
      userEvent.upload(file ,newFile)
      

    // newBill.fileUrl = 'https://test.storage.tld/v0/b/billable-677b6.a…dur.jpg?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3'
    // newBill.fileName = "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.jpg"
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formSubmit.addEventListener("submit", handleSubmit);
      fireEvent.submit(formSubmit)

      expect(mockSpy).toHaveBeenCalled()
      //expect(handleSubmit).toBeCalled()
      //expect(createBill).toHaveBeenCalled()
    
    
    // const handleSubmit = jest.spyOn(newBill, 'handleSubmit')
    // const updateBill = jest.spyOn(newBill, 'updateBill')
    // const changeMockStore = jest.spyOn(mockStore, "bills");
    // formSubmit.addEventListener('submit', handleSubmit)
    // fireEvent.submit(formSubmit)
    
    // expect(handleSubmit).toHaveBeenCalled()
    // expect(updateBill).toHaveBeenCalled()
    // expect(changeMockStore).toHaveBeenCalled();
    //await waitFor(() => screen.getByText("Mes notes de frais"))

    
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