const verifyBtn = document.querySelector('.verify')

verifyBtn.addEventListener('click', (e) => {
    e.preventDefault()
    console.log('it worked')
    let response = await fetch(`${url}`, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method: "GET"
    })

})

console.log('line 16')