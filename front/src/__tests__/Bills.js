/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import {fireEvent, getByAltText, getByTestId, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      //icone du vertical layout bien présent
      const windowIcon = await screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon')

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
    test('Then button new bills should render new bill page', async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const buttonNewBill = await screen.getByText('Nouvelle note de frais')
      fireEvent.click(buttonNewBill)
      const newBill = await screen.getByText('Envoyer une note de frais')
      expect(newBill).toBeTruthy()
    })

    test('Then eye-icon button should shows right image modal', async () => {
      
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))

      // on regarde simplement si la modale s'affiche en regardant l'alt de l'image
      const modalFile = document.getElementById('modaleFile')
      $.fn.modal = jest.fn(() => modalFile.classList.add('show'))
      const eyeButton = screen.getAllByTestId('icon-eye')

      fireEvent.click(eyeButton[1])
      const url = eyeButton[1].dataset.billUrl
      const modal = screen.getByAltText('Bill')
      const modalSrc = modal.src.replace('%E2%80%A6','…')
      //la modale s'affiche ?
      expect(modal).toBeVisible()
      expect(modalFile).toHaveClass('show')
      //est-ce la bonne image ?
      expect(modalSrc).toBe(url)
      
    })
})




//test d'intégration GET avec erreurs 404 et 500

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee"}));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      //les 4 notes de frais sont elles présentes ?
      const content1 = screen.getByText('encore')
      expect(content1).toBeDefined()
      const content2 = screen.getByText('test1')
      expect(content2).toBeDefined()
      const content3 = screen.getByText('test3')
      expect(content3).toBeTruthy()
      const content4 = screen.getByText('test2')
      expect(content4).toBeDefined()
      //verification par taille 
      expect(screen.getAllByTestId('icon-eye').length).toEqual(4)
      //modale pour l'affichage de la note de frais
      expect(screen.getByText('Justificatif')).toBeVisible()
      //bouton pour une nouvelle note de frais
      expect(screen.getByTestId('btn-new-bill')).toHaveTextContent('Nouvelle note de frais')
      //body avec les notes de frais et defined
      expect(screen.getByTestId("tbody")).toBeDefined()
      //body avec les 4 notes de frais
      expect(screen.getByTestId("tbody")).toHaveTextContent('encore')
      expect(screen.getByTestId("tbody")).toHaveTextContent('test1')
      expect(screen.getByTestId("tbody")).toHaveTextContent('test3')
      expect(screen.getByTestId("tbody")).toHaveTextContent('test2')
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
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  })
})
