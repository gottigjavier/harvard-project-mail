document.addEventListener('DOMContentLoaded', function() {


  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // send email wrong -> reload compose_email()
  // send email successfully -> load_mailbox('sent')
  // by default -> load_mailbox('inbox')  
  if (sessionStorage.length > 1){
    let {recipients, subject, body} = sessionStorage;
    compose_email(recipients, subject, body);
    sessionStorage.clear();
  } else if (sessionStorage.length == 1){
    load_mailbox('sent');
    sessionStorage.clear();
  } else {
    load_mailbox('inbox');
  }
  });

function compose_email(recipients="", subject="", body="", date='') {

  // storage.length == 0 --> compose (empty default arguments) or reply 
// storage.length != 0 --> something went wrong, reload compose 
  if (sessionStorage.length == 0){
    // To reply add subject
    if (subject != "" && !subject.includes('Re: ')){
    subject = 'Re: ' + subject;
    }
    // Add wrote in body to reply 
    if (body != ""){
      body = 'On ' + date + ' <' + recipients + '> wrote: \r\n\n' + body;
      }
  }
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-read').style.display = 'none';

  // Composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;


  document.querySelector('#send').addEventListener('click', () => send_email())
}

function send_email(){
  // Composition fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
 
  fetch('http://localhost:8000/emails', {
    method: 'POST',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'crossorigin': 'anonymous'
    },
    body: JSON.stringify({
        recipients,
        subject,
        body
    })
  })
  .then(response =>  response.json())  
  .then(result => {
    const resultKey = Object.keys(result)
    if (resultKey == 'message') {
      window.alert(result['message']);
      sessionStorage.setItem('sent', 'sent');
      // send ok -> storage length == 1 -> load_mailbox('sent')
    } else {
      window.alert(result['error']);
      // wrong compose -> storage.length ==3 --> reload compose_email()
      sessionStorage.setItem('recipients', recipients);
      sessionStorage.setItem('subject', subject);
      sessionStorage.setItem('body', body);
    } 
  })      
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-read').style.display = 'none';
      
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`http://localhost:8000/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Table head     
    table_head(mailbox);
            
    // The mails list 

    // It's more efficient to load them in "Fragment" here called $listEmail
    // This way it is only inserted into the DOM once and not every time an element is created.
    const $emailContent = document.createElement('div');
    $emailContent.setAttribute('class', 'scroll');
    $emailContent.setAttribute('style', 'height:21rem; overflow:auto;');
    const $listEmail = document.createDocumentFragment();
    // create each email of the list
    emails.forEach(element => {
      const $row = document.createElement('tr'),
            $check = document.createElement('input'),
            $rowAndCheck = document.createElement('div'),
            $col1 = document.createElement('td'),
            $col2 = document.createElement('td'),
            $col3 = document.createElement('td');
        
      const $subject = document.createElement('div'),
            $sender = document.createElement('div'),
            $date = document.createElement('div');
            
      $col1.setAttribute('class', 's-px-2');
      $col2.setAttribute('class', 's-main-center');
      $col3.setAttribute('class', 's-px-3 s-main-center');
      $check.setAttribute('type', 'checkbox');
      $check.setAttribute('class', 'mail-checkbox ed-grid s-cols-1 s-x-12 s-ml-4 s-px-0');
      $check.setAttribute('name', 'mail-checkbox');
      $check.setAttribute('value', `${element.id}`);
      $rowAndCheck.setAttribute('class', 'ed-grid s-grid-12');
      $row.setAttribute('id', `row-${element.id}`);
      row_class($row, element);
      
      $subject.innerHTML = element.subject;
      mailbox == 'sent' ? $sender.innerHTML = element.recipients :$sender.innerHTML = element.sender;
      $date.innerHTML = element.timestamp;
      
      $col1.appendChild($subject);
      $col2.appendChild($sender);
      $col3.appendChild($date);
      
      $row.appendChild($col1);
      $row.appendChild($col2);
      $row.appendChild($col3);

      $rowAndCheck.appendChild($row);

      // No checkboxes for sent list 
      if (mailbox !== 'sent'){
        $rowAndCheck.appendChild($check);
        mailbox == 'inbox' ? document.querySelector('#ethead').appendChild($archive) : document.querySelector('#ethead').appendChild($unarchive);
      }

      $listEmail.appendChild($rowAndCheck);

      $row.addEventListener('click', () => email(element.id));

      $check.addEventListener('change', () => checked($check, element));
    });

    $emailContent.appendChild($listEmail);
    document.querySelector('#etable').appendChild($emailContent);

    $archive.addEventListener('click', () => archive_emails());

    $unarchive.addEventListener('click', () => unarchive_emails());
  });
}

// create table and email list header
function table_head(mailbox){
  const $tablecont = document.createElement('div');
  $tablecont.setAttribute('id', 'tablecont');
  $tablecont.setAttribute('class', 'table-container s-border s-pxy-1');
  document.querySelector('#emails-view').appendChild($tablecont);      

  // create table
  const $table = document.createElement('table');
  $table.setAttribute('id', 'etable');
  $table.setAttribute('class', 'ed-grid s-grid-1');
  document.querySelector('#tablecont').appendChild($table);  
  
  // Creating head of table
  const $thead = document.createElement('thead');
  $thead.setAttribute('id', 'ethead');
  $thead.setAttribute('class', 'ed-grid s-grid-11 s-pxy-1');
  document.querySelector('#etable').appendChild($thead);

  const $headCol1 = document.createElement('th')
  $headCol1.setAttribute('id', 'head-col1');
  $headCol1.setAttribute('class', 's-x-1 s-cols-2');
  document.querySelector('#ethead').appendChild($headCol1);      
  document.querySelector('#head-col1').innerHTML = 'Subject';
    
  const $headCol2 = document.createElement('th')
  $headCol2.setAttribute('id', 'head-col2');
  $headCol2.setAttribute('class', 's-x-5 s-cols-2');
  document.querySelector('#ethead').appendChild($headCol2);       
  if (mailbox === 'sent'){
    document.querySelector('#head-col2').innerHTML = 'Recipient';
  } else {
    document.querySelector('#head-col2').innerHTML = 'Mailer';
  }
  
  const $headCol3 = document.createElement('th')
  $headCol3.setAttribute('id', 'head-col3');
  $headCol3.setAttribute('class', 's-x-8 s-cols-2');
  document.querySelector('#ethead').appendChild($headCol3);      
  document.querySelector('#head-col3').innerHTML = 'Date';
  const $br = document.createElement('br');
  document.querySelector('#etable').appendChild($br);

  $archive = document.createElement('button');
  $archive.setAttribute('id', 'to-archive');
  $archive.setAttribute('class', 'button s-x-11 s-cols-1');
  $archive.innerHTML = 'Archive';

  $unarchive = document.createElement('button');
  $unarchive.setAttribute('id', 'to-unarchive');
  $unarchive.setAttribute('class', 'button s-x-11 s-cols-1 s-ml-2 s-main-start');
  $unarchive.innerHTML = 'Unarchive';
}

// background color for read and unread emails
function row_class($row, element){
  if (element.read) {
    $row.setAttribute('class', 'read mail-row ed-grid s-x-1 s-cols-11 s-grid-3 s-border s-py-1 s-radius');
  } else {
    $row.setAttribute('class', 'unread mail-row ed-grid s-x-1 s-cols-11 s-grid-3 s-border s-py-1 s-radius');
      
  }
}

// Color the checked row
function checked($check, element){
  row = document.querySelector(`#row-${$check.value}`);
  let rowClass = row.getAttribute('class');
  if (rowClass.includes('checked', 0)){
    row_class(row, element);
  } else {
    row.setAttribute('class', 'checked mail-row ed-grid s-x-1 s-cols-11 s-grid-3 s-border s-py-1 s-radius');
  }
}

function archive_emails(){
  const checkboxes = document.querySelectorAll('input[name="mail-checkbox"]:checked');
  if (checkboxes.length > 0){
  checkboxes.forEach(el => {    
    fetch(`http://localhost:8000/emails/${el.value}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    });
  });
  window.alert ('sent to the "Archived" folder');
  } else {
    window.alert ('No Emails selected');
  }
  load_mailbox('inbox');    
}

function unarchive_emails(){
  const checkboxes = document.querySelectorAll('input[name="mail-checkbox"]:checked');    
  if (checkboxes.length > 0){
    checkboxes.forEach(el => {    
      fetch(`http://localhost:8000/emails/${el.value}`, {
        method: 'PUT',
        body: JSON.stringify({
        archived: false
        })
      });
    });
    window.alert ('sent to the "Inbox" folder');
  } else {
    window.alert ('No Emails selected');
  }
  load_mailbox('inbox');    
}
  
function archive_an_email(email_id){
  fetch(`http://localhost:8000/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
  window.alert ('sent to the "Archived" folder');
  load_mailbox('inbox');
}

function unarchive_an_email(email_id){
  fetch(`http://localhost:8000/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  window.alert ('sent to the "Inbox" folder');
  load_mailbox('inbox');
}


function email(email_id){
  // Show the read_mail and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-read').style.display = 'block';
  
  fetch(`http://localhost:8000/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // get current user to not show reply and archive options in sent mailbox
    currentUser = document.querySelector('#box-user').innerHTML;

    // Create DOM objects ------------------------------
    const $emailRecipient = document.createElement('div'),
          $sender = document.createElement('div'),
          $subject = document.createElement('div'),
          $date = document.createElement('div'),
          $emailBody = document.createElement('div'),
          $emailBodyText = document.createElement('textarea'),
          $buttonContainer = document.createElement('div'),
          $dateButtonContainer = document.createElement('div'),
          $reply = document.createElement('button'),
          $archive = document.createElement('button'),
          $unarchive = document.createElement('button'),
          $oneEmailContainer = document.createElement('div');
  
    const $oneEmail = document.createDocumentFragment();
  
    // Set Atributes --------------------------------------
    $emailRecipient.setAttribute('class', 's-px-2');
    $sender.setAttribute('class', 's-px-2');
    $subject.setAttribute('class', 's-px-2');
    $date.setAttribute('class', 's-px-2 s-x-1 s-cols-3');
    $oneEmailContainer.setAttribute('class', 'ed-grid s-border s-pxy-2');
    $oneEmailContainer.setAttribute('id', 'one-email-container');  
    $emailBody.setAttribute('class', 's-px-2');
    $emailBodyText.setAttribute('id', 'message');
    $emailBodyText.setAttribute('class', 's-border s-pxy-2 scroll');
    
    $buttonContainer.setAttribute('class', 's-x-4 s-cols-1 s-grid-2 rows-gap')
    $dateButtonContainer.setAttribute('class', 'ed-container ed-grid s-grid-4');
    $reply.setAttribute('id', 'to-reply');
    $reply.setAttribute('class', 'button s-x-1 s-cols-1 s-mr-1');
    $archive.setAttribute('id', 'to-archive-one');
    $archive.setAttribute('class', 'button s-x-2 s-cols-1');
    $unarchive.setAttribute('id', 'to-unarchive-one');
    $unarchive.setAttribute('class', 'button s-x-2 s-cols-1');
      
    // To clean old emails ------------------------------------------
    const $emailRead = document.querySelector('#email-read');
    const $toClean = document.querySelector('#one-email-container')
  
    if ($toClean){
      $emailRead.removeChild($toClean);
      }
    // ---------------------------------------------------------------
    
    // Fill DOM objects with json values
    $emailRecipient.innerHTML = '<b>To: </b> &lt ' + email.recipients + ' &gt</br></br>';
    $sender.innerHTML = '<b>From: </b> &lt ' + email.sender + ' &gt</br></br>';
    $subject.innerHTML = '<b>Subject: </b> "' + email.subject + '"</br></br>';
    $date.innerHTML = '<b>Date: </b>' + email.timestamp + '</br></br>';
    $emailBodyText.innerHTML = email.body;
    $emailBody.innerHTML = '<b>Message: </b>';
  
    $reply.innerHTML = 'Reply';
    $archive.innerHTML = 'Archive';
    $unarchive.innerHTML = 'Unarchive';
  
    // Append childs if != sent emails, else no reply and no archive/unarchive buttons
    if (currentUser != email.sender){
      $buttonContainer.appendChild($reply);    
      if (email.archived){
        $buttonContainer.appendChild($unarchive);
      } else {
      $buttonContainer.appendChild($archive);
      }
    }
  
    $dateButtonContainer.appendChild($date);
    $dateButtonContainer.appendChild($buttonContainer);
    
    $emailBody.appendChild($emailBodyText);
  
    $oneEmail.appendChild($emailRecipient);
    $oneEmail.appendChild($sender);
    $oneEmail.appendChild($subject);
    $oneEmail.appendChild($dateButtonContainer);
    $oneEmail.appendChild($emailBody);
    
    $oneEmailContainer.appendChild($oneEmail);
    
    document.querySelector('#email-read').appendChild($oneEmailContainer); 
    
    // color this email as read
    fetch(`http://localhost:8000/emails/${email_id}`,{
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    // no sent emails list -> reply and archive buttons listen
    if (currentUser != email.sender){
      document.querySelector('#to-reply').addEventListener('click', () => compose_email(email.sender, email.subject, email.body, email.timestamp));    
      if (email.archived){
        document.querySelector('#to-unarchive-one').addEventListener('click', () => unarchive_an_email(email_id));
      } else {
        document.querySelector('#to-archive-one').addEventListener('click', () => archive_an_email(email_id));
      }   
    }  
  });
}