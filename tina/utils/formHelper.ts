// tina/utils/formHelper.ts
/**
 * Helper utility to reliably access TinaCMS form values
 * Handles different TinaCMS versions and form access patterns
 */

export function getFormValues(cms: any, field: any, input?: any): any {
  let formValues: any = {};
  
  // Method 1: Access through cms.state.forms[0].tinaForm.values
  try {
    if (cms?.state?.forms && Array.isArray(cms.state.forms) && cms.state.forms.length > 0) {
      const firstForm = cms.state.forms[0];
      
      // Check if it has tinaForm property
      if (firstForm.tinaForm) {
        console.log('Found tinaForm:', firstForm.tinaForm);
        
        // Try to get values - might be a getter
        if (firstForm.tinaForm.values) {
          formValues = firstForm.tinaForm.values;
          console.log('✓ Got form values via cms.state.forms[0].tinaForm.values');
          return formValues;
        }
        
        // Try finalForm.getState()
        if (firstForm.tinaForm.finalForm && typeof firstForm.tinaForm.finalForm.getState === 'function') {
          const state = firstForm.tinaForm.finalForm.getState();
          if (state?.values) {
            formValues = state.values;
            console.log('✓ Got form values via cms.state.forms[0].tinaForm.finalForm.getState()');
            return formValues;
          }
        }
      }
      
      // Also try direct values on the form
      if (firstForm.values) {
        formValues = firstForm.values;
        console.log('✓ Got form values via cms.state.forms[0].values');
        return formValues;
      }
    }
  } catch (e) {
    console.warn('Method 1 failed (cms.state.forms[0].tinaForm):', e);
  }
  
  // Method 2: Try cms.forms.all() - even though it was empty, try again
  try {
    const forms = cms.forms.all();
    if (forms && forms.length > 0) {
      const form = forms[0];
      
      if (form?.values) {
        formValues = form.values;
        console.log('✓ Got form values via cms.forms.all()[0].values');
        return formValues;
      }
      
      if (form?.finalForm?.getState) {
        const state = form.finalForm.getState();
        if (state?.values) {
          formValues = state.values;
          console.log('✓ Got form values via cms.forms.all()[0].finalForm.getState()');
          return formValues;
        }
      }
    }
  } catch (e) {
    console.warn('Method 2 failed (cms.forms.all):', e);
  }

  console.error('❌ All methods to access form values failed');
  console.log('cms.state.forms:', cms?.state?.forms);
  if (cms?.state?.forms?.[0]) {
    console.log('First form object:', cms.state.forms[0]);
    console.log('First form keys:', Object.keys(cms.state.forms[0]));
    if (cms.state.forms[0].tinaForm) {
      console.log('tinaForm keys:', Object.keys(cms.state.forms[0].tinaForm));
      console.log('tinaForm:', cms.state.forms[0].tinaForm);
    }
  }
  
  return {};
}

export function logFormDebugInfo(cms: any, field: any, input?: any, componentName?: string) {
  console.group(`🔍 ${componentName || 'Component'} Debug Info`);
  
  console.log('CMS object:', cms);
  console.log('CMS keys:', Object.keys(cms || {}));
  
  // Detailed CMS state inspection
  if (cms?.state) {
    console.log('cms.state:', cms.state);
    console.log('cms.state keys:', Object.keys(cms.state));
    
    // Inspect forms array
    if (cms.state.forms && Array.isArray(cms.state.forms)) {
      console.log('cms.state.forms length:', cms.state.forms.length);
      if (cms.state.forms.length > 0) {
        console.log('First form:', cms.state.forms[0]);
        console.log('First form keys:', Object.keys(cms.state.forms[0]));
        
        if (cms.state.forms[0].tinaForm) {
          console.log('tinaForm:', cms.state.forms[0].tinaForm);
          console.log('tinaForm keys:', Object.keys(cms.state.forms[0].tinaForm));
          
          // Try to access values
          try {
            const values = cms.state.forms[0].tinaForm.values;
            console.log('tinaForm.values:', values);
          } catch (e) {
            console.log('Could not access tinaForm.values:', e);
          }
          
          // Try finalForm
          if (cms.state.forms[0].tinaForm.finalForm) {
            console.log('tinaForm.finalForm exists');
            if (typeof cms.state.forms[0].tinaForm.finalForm.getState === 'function') {
              try {
                const state = cms.state.forms[0].tinaForm.finalForm.getState();
                console.log('finalForm.getState():', state);
                console.log('finalForm.getState().values:', state?.values);
              } catch (e) {
                console.log('Could not call finalForm.getState():', e);
              }
            }
          }
        }
      }
    }
  }
  
  console.log('Field object:', field);
  console.log('Field keys:', Object.keys(field || {}));
  
  if (input) {
    console.log('Input object:', input);
    console.log('Input keys:', Object.keys(input || {}));
  }
  
  try {
    if (cms?.forms?.all) {
      const forms = cms.forms.all();
      console.log('cms.forms.all() result:', {
        exists: !!forms,
        length: forms?.length || 0,
        forms: forms
      });
    }
  } catch (e) {
    console.log('cms.forms.all() failed:', e);
  }
  
  console.groupEnd();
}