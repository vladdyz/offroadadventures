(function () {
    'use strict'
        bsCustomFileInput.init() //Mini-plugin for Bootstrap that allows custom file input for our forms which allow uploads of multiple images simultaneously
        //gives them some basic JS functionality
        //UPDATE: This is no longer compatible with the Bootstrap version being used in this app and the functionality was removed :(
      

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.validated-form')

    // Loop over them and prevent submission
    Array.from(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })
})()