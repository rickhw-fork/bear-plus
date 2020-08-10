/* global $:true */
$('#setting-btn').click((e) => {
  fetch('/api/1.0/user/setting')
    .then(res => res.json())
    .then(body => {
      $('#userurlHelp').text('Short URL path for your profile. Allow a-Z, 0-9 and dash.').removeClass('error').addClass('text-muted');
      $('#emailHelp').text('');
      $('#avatareHelp').text('');
      $('#password-form').css('display', 'none');
      $('#setting-save').attr('disabled', true);
      if (body.provider == 'native') {
        $('#setting-username').attr('placeholder', decodeURIComponent(body.profile.name));
        $('#setting-userurl').attr('placeholder', body.userUrl);
        $('#setting-email').attr('placeholder', body.email);
        $('#setting-avatar').attr('src', body.profile.photo);
        $('#change-password').css('display', 'block');
        $('#password-msg').text('');
      } else {
        $('#setting-userurl').attr('placeholder', body.userUrl);
        $('#setting-username').attr('placeholder', decodeURIComponent(body.profile.name));
        $('#setting-avatar').attr('src', body.profile.biggerphoto);
        $('#email-group').css('display', 'none');
        $('#password-group').css('display', 'none');
      }
    }).catch(error => console.error('Error:', error));
});

$('#setting-userurl').on('input', () => {
  var regexp = new RegExp('[^a-zA-Z0-9-]', 'g');
  if ($('#setting-userurl').val().match(regexp)) {
    $('#userurlHelp').text('character not allow').removeClass('text-muted').addClass('error');
    $('#setting-save').attr('disabled', true);
  } else if (!$('#setting-userurl').val() && !$('#setting-username').val() && !$('#setting-email').val()) {
    $('#userurlHelp').text('Short URL path for your profile. Allow a-Z, 0-9 and dash.').removeClass('error').addClass('text-muted');
    $('#setting-save').attr('disabled', true);
  } else {
    $('#userurlHelp').text('Short URL path for your profile. Allow a-Z, 0-9 and dash.').removeClass('error').addClass('text-muted');
    $('#setting-save').attr('disabled', false);
  }
});

$('#setting-username').on('input', () => {
  if (!$('#setting-userurl').val() && !$('#setting-username').val() && !$('#setting-email').val()) {
    $('#setting-save').attr('disabled', true);
  } else {
    $('#setting-save').attr('disabled', false);
  }
});

$('#photo-input').on('change', (e) => {
  $('#avatareHelp').text('');
  const formData = new FormData();
  formData.append('avatar', e.target.files[0]);

  fetch('/api/1.0/user/avatar', {
    method: 'POST',
    body: formData
  }).then(res => res.json())
    .then(({ error, url }) => {
      if (error) $('#avatareHelp').text(error);
      $('#setting-avatar').attr('src', url);
      $('.user-icon').attr('src', url);
    }).catch(error => console.error('Error:', error));
});

$('#setting-save').click(() => {
  const username = $('#setting-username').val() ? $('#setting-username').val() : null;
  const userUrl = $('#setting-userurl').val() ? $('#setting-userurl').val() : null;
  const email = $('#setting-email').val() ? $('#setting-email').val() : null;
  const data = { username, email, userUrl };
  fetch('/api/1.0/user/setting', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    },
  }).then(res => res.json())
    .then((body) => {
      if (body.error) {
        alert(body.error);
      }
      if (body.urlError) {
        $('#userurlHelp').text(body.urlError).removeClass('text-muted').addClass('error');
      }
      if (body.emailError) {
        $('#emailHelp').text(body.urlError).removeClass('text-muted').addClass('error');
      }
      if (body.username) {
        $('.user-name').text(body.username);
      }
      if (body.userUrl && !body.urlError && !body.emailError) {
        document.location.href = `/@${userUrl}`;
      } else if(!body.urlError && !body.emailError){
        $('#setting-modal').modal('toggle');
      }
    })
    .catch (error => console.error('Error:', error));
});

$('#change-password').click((e) => {
  console.log('pasasword click');
  $(e.target).css('display', 'none');
  $('#password-form').css('display', 'flex');
});

$('#password-form').on('submit', (e) => {
  e.preventDefault();
  const password = $('#curr-password').val();
  const newPassword = $('#new-password').val();
  fetch('/api/1.0/user/password', {
    method: 'POST',
    body: JSON.stringify({ password, newPassword }),
    headers: {
      'content-type': 'application/json'
    },
  }).then(res => res.json())
    .then(({ error, msg }) => {
      if (error) {
        $('#curr-password').val('');
        $('#passwordHelp').text(error).removeClass('text-muted').addClass('error');
      } else {
        $('#change-password').css('display', 'flex');
        $('#password-form').css('display', 'none');
        $('#password-msg').text(msg);
      }
    }).catch(error => console.error('Error:', error));
});

$('#curr-password').on('input', (e) => {
  $('#passwordHelp').text('');
});

$('#confirm-password').on('input',(e) => {
  if ($(e.target).val() !== $('#new-password').val()) {
    $('#password-save').attr('disabled', true);
    $('#passwordHelp').text('Passwords do not match').removeClass('text-muted').addClass('error');
  } else {
    $('#password-save').attr('disabled', false);
    $('#passwordHelp').text('');
  }
});