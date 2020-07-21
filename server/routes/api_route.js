const router = require('express').Router();
const { upload } = require('../util');
const s3Upload = upload('');
const noteImageUpload = s3Upload.fields([{ name: 'image', maxCount: 1 }]);

const { register, emailAuthenticate, facebookSignin, facebookCallback, googleSignin, googleCallback,  signinRedirect} = require('../auth/auth_controller');
const { uploadImage, createNewNote } = require('../note/note_controller');
const { collabStart, collabPoll, collabSend } = require('../collab/collab_controller');

// Auth
router.route('/register')
  .post(register, emailAuthenticate, signinRedirect);

router.route('/signin')
  .post(emailAuthenticate, signinRedirect);

router.route('/auth/facebook')
  .get(facebookSignin);

router.route('/auth/facebook/callback')
  .get(facebookCallback,signinRedirect);

router.route('/auth/google')
  .get(googleSignin);

router.route('/auth/google/callback')
  .get(googleCallback,signinRedirect);

router.route('/logout')
  .get((req, res) => {
    req.logOut();
    res.redirect('/');
  });

// Note
router.route('/note')
  .get(createNewNote);

// Editor
router.route('/:id')
  .get(collabStart);

router.route('/:id/events')
  .get(collabPoll)
  .post(collabSend);

router.route('/editor/image')
  .post(noteImageUpload, uploadImage);

module.exports = router;