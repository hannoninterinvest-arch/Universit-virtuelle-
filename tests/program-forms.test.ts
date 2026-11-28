import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formSchema,validateAnswers,type Field} from '../lib/program-forms';
const f:Field={id:'90a701d3-266b-4b90-b60a-7dbe93500b13',label:'Diplôme',type:'select',required:true,hint:'',options:['Licence','Master']};
test('required only on submit',()=>{assert.equal(Object.keys(validateAnswers([f],{},false).errors).length,0);assert.ok(validateAnswers([f],{},true).errors[f.id]);});
test('valid published choices',()=>{assert.ok(validateAnswers([f],{[f.id]:'Autre'},true).errors[f.id]);assert.equal(validateAnswers([f],{[f.id]:'Licence'},true).answers[f.id],'Licence');});
test('unknown and duplicate fields rejected',()=>{assert.ok(validateAnswers([f],{unknown:'x'},false).errors.form);assert.equal(formSchema.safeParse([f,f]).success,false);});
