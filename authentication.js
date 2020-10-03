'use strict';

// You want to make a request to an endpoint that is either specifically designed
// to test auth, or one that every user will have access to. eg: `/me`.
// By returning the entire request object, you have access to the request and
// response data for testing purposes. Your connection label can access any data
// from the returned response using the `json.` prefix. eg: `{{json.username}}`.
//const test = (z, bundle) =>
 // z.request({ url: 'https://cms.muvi.com/rest/LoginV1' });

const test = (z, bundle) => {
    // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
    // every user will have access to, such as an account or profile endpoint like /me.
    // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path
  
    // This method can return any truthy value to indicate the credentials are valid.
    // Raise an error to show

    const queryString = require('query-string');
    const postData = queryString.stringify(bundle.authData);
    
    //console.log(postData);
    //request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    //request.headers['Content-Length'] = postData.length;
    //request.body = postData;

    return z.request({
          url: 'https://cms.muvi.com/rest/LoginV1',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
          },
          body: postData,
        }).then((response) => {
        if (typeof response.json === 'undefined') {
          throw new Error('The URL you provided is not the base URL of a Mautic instance');
        }
        return response;
      });
  };

// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const handleBadResponses = (response, z, bundle) => {
  //console.log();
  if (response.json.code === 406) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'Email or Password is invalid!',
      'AuthenticationError',
      406
    );
  }

  if (response.json.code === 407) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'Oauth Token required!',
      'AuthenticationError',
      407
    );
  }

  if (response.json.code === 408) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'Invalid Oauth Token!',
      'AuthenticationError',
      408
    );
  }

  return response;
};

const includeApiKey = (request, z, bundle) => {
 
  if (bundle.authData.authToken) {
    // Use these lines to include the API key in the querystring
    request.params = request.params || {};
    //request.params.authToken = bundle.authData.authToken;
    request.headers['authtoken'] = bundle.authData.authToken;
  }

  return request;
};

module.exports = {
  config: {
    // "basic" auth automatically creates "username" and "password" input fields. It
    // also registers default middleware to create the authentication header.
    type: 'custom',

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [
      { key: 'email', label: 'Email', required: true, helpText: 'Go to the (https://cms.muvi.com/settings/account) screen from your Muvi CMS to find your login Email'},
      { key: 'password',label: 'Password', required: true,type: 'password', helpText: 'Your password for muvi store'},
      { key: 'authToken',type: 'string', required: true, helpText: 'Go to the (https://cms.muvi.com/settings/advanced) screen from your Muvi CMS to find your API Key.'}
    ],

    // The test method allows Zapier to verify that the credentials a user provides
    // are valid. We'll execute this method whenver a user connects their account for
    // the first time.
    test,

    // This template string can access all the data returned from the auth test. If
    // you return the test object, you'll access the returned data with a label like
    // `{{json.X}}`. If you return `response.data` from your test, then your label can
    // be `{{X}}`. This can also be a function that returns a label. That function has
    // the standard args `(z, bundle)` and data returned from the test can be accessed
    // in `bundle.inputData.X`.
    connectionLabel: '{{json.display_name}}',
  },
  befores: [includeApiKey],
  afters: [handleBadResponses],
};
