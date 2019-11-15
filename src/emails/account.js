import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'adeniyifamojuro@zohomail.com',
        subject: 'Thanks for joining in',
        text: `Welcome to the app ${name}. Let me know how you enjoy the app`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'adeniyifamojuro@zohomail.com',
        subject: 'App Unsubscription',
        text: `Hi ${name}. I noticed you have unsubcribed.Thanks for using our service. Cheers`
    })
}

export  {sendWelcomeEmail, sendCancelEmail}



