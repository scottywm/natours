import axios from 'axios'
import { showAlert } from './alerts'

export const login = async (email, password) => {
    // Because axios requests throw an error when we get an error back from our endpoint we can use a try catch block
    try{
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:1514/api/v1/users/login',
            data: {
                email: email,
                password: password
            }
        })

        if(res.data.status === 'success'){
            showAlert('success','Logged In successfully')
            window.setTimeout(()=> {
                location.assign('/');
            }, 1500)
        }
    } catch(err){
        showAlert('error', err.response.data.message)
    }
}

export const logOut = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:1514/api/v1/users/logout'
        })

       if(res.data.status = 'success') location.reload(true)
    } catch(err) {
        showAlert('error', 'Error logging out! Try again.')
    }
}