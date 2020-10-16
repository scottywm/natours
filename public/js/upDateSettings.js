import axios from 'axios'
import { showAlert } from './alerts'

export const upDateSettings = async (data, type) => {
    // type is either password or data
    try {
        const url = type === 'password' ? 'http://127.0.0.1:1514/api/v1/users/updateMyPassword' : 'http://127.0.0.1:1514/api/v1/users/updateMe'
        const res = await axios({
            method: 'PATCH',
            url: url,
            // data: { // with axios requests what you put in this 'data' field will be inside the 'body' field on the server side when express receives the request. Thus this data can only be accessed by req.bod and this will give an object containing this data.
            //     name,
            //     email
            // }
            data: data // with axios requests what you put in this 'data' field will be inside the 'body' field on the server side when express receives the request. Thus this data can only be accessed by req.bod and this will give an object containing this data.
        })

if (res.data.status === 'success') {
    showAlert('success', `${type.toUpperCase()} updated successfully`)
}
    } catch(err){
        showAlert('error', err.response.data.message)
    }
}