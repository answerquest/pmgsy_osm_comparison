var authorize_url = "https://www.openstreetmap.org/oauth2/authorize"
var token_url = "https://www.openstreetmap.org/oauth2/token"

var callback_uri = "https://server.nikhilvj.co.in/pmgsy/"
var test_api_url = "https://server.nikhilvj.co.in/pmgsy/"

var client_id = '0u1e1gWP-Gq7RxEQ5j_QDtcqzst_kwQIbPAEB-1Cw8U'
var client_secret = 'OcUmaeA-uayNspeP0xeeIwJhXaYowB36EHIishy8x54'

var authorization_redirect_url = authorize_url + '?response_type=code&client_id=' + client_id + '&redirect_uri=' + callback_uri + '&scope=read_prefs'
// var return_url = "https://server.nikhilvj.co.in/pmgsy/?code=d-Rfh6hV0O99XGjYuNaXhZFWi9Dc3d9uIZ8Ix6_ADgQ"
// var authorization_code = return_url.split('code=')[-1]
// var data = { 'grant_type': 'authorization_code', 'code': authorization_code, 'redirect_uri': callback_uri }


function auth_login() {
    window.location.href = authorization_redirect_url
    } 

function getAtoken(acode) {
    var get_access_token = {
        "url": "https://www.openstreetmap.org/oauth2/token",
        "method": "POST",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "data": {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": acode,
            "grant_type": "authorization_code",
            "redirect_uri": "https://server.nikhilvj.co.in/pmgsy/",
        }
    };

    $.ajax(get_access_token).done(function (response) {
        // console.log(response);
        getUDetails(response.access_token)
    });
}

function getUDetails(atoken) {
    // API call for user details
    var get_user_details = {
        "url": "https://api.openstreetmap.org/api/0.6/user/details.json",
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + atoken, 
        },
    };
    $.ajax(get_user_details).done(function (response) {
        console.log(response);
        var display_name = response.user.display_name;
        console.log(display_name)
    });
}

// RUN ON PAGE LOAD
$(document).ready(function() {
    loadURLParams(URLParams)
    if (URLParams['code']){
        getAtoken(URLParams['code'])
    }
})
