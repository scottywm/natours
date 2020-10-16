import Axios from "axios"

import {showAlert} from './alerts'
import axios from 'axios'
const stripe = Stripe('pk_test_51HZIGkBXHHhjpKb1PZ1aUZZZNcwv1iKMWRGUGvyveG1pfsKm5SOzTPDPNZMfgTSNUmGKzhOwrzw9ZKhYOMxMBhw1006V51mwLg')

export const bookTour = async tourID => {
    // 1) Get checkout session from API
    try {
        const session = await axios(`http://127.0.0.1:1514/api/v1/booking/checkout-session/${tourID}`)
        console.log(session)

    // 2) Create checkout form and charge customer
    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
    })
    } catch(err) {
        console.log(err)
        showAlert('error', error)
    }
}