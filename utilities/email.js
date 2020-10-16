const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

module.exports = class Email{
    constructor(user, url) {
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `From Scott McMahon <${process.env.EMAIL_FROM}>`
    }

    newTransport() {
        if(process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USERNAME,
                    pass: process.env.GMAIL_PASSWORD
                }
            })
        }

        // create a transport
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USERNAME,
                pass: process.env.GMAIL_PASSWORD
            }

        })
    }

    // send the actual email
    async send(template, subject) {
        // 1 ) Render HTML based on PUG template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        })

        // Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text: htmlToText.fromString(html),
            html
        }

        // create a transport and send an email
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome() {
        await this.send('welcome', 'welcome to the natours family!')
    }

    async sendVerify() {
        await this.send('emailVerify', 'Please verify your account')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token is valid for 10 minutes')
    }
}
