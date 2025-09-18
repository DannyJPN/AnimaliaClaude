// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
$(document).ready(function () {
  $("button[name='sso-login']").click(function (evt) {
    evt.preventDefault();

    const callback = $("[name='Callback']").val();
    const returnUrl = $("[name='ReturnUrl']").val();

    $.get(`/authenticate/sso?returnUrl=${returnUrl}&callback=${callback}`)
      .done(function (data) {
        window.location.replace(data.redirectUrl);
      })
      .fail(function () {
        alert("SSO přihlášení selhalo!");
      });
  });
});
