import test from 'node:test';
import assert from 'node:assert/strict';
import { draftSchema,submissionSchema,emptyFields,mayEdit,mayReview } from '../lib/admissions';
const full={...emptyFields,firstName:'Amira',lastName:'Test',birthDate:'2002-01-02',nationality:'Tunisienne',phone:'+216 55 000 000',country:'Tunisie',city:'Tunis',degree:'Licence',institution:'Université de Tunis',graduationYear:'2025',program:'Informatique'};
test('a partial draft is permitted but cannot be submitted',()=>{assert.equal(draftSchema.safeParse(emptyFields).success,true);assert.equal(submissionSchema.safeParse(emptyFields).success,false);});
test('valid dossier passes, future birthdate and invalid phone fail',()=>{assert.equal(submissionSchema.safeParse(full).success,true);assert.equal(submissionSchema.safeParse({...full,birthDate:'2999-01-01'}).success,false);assert.equal(submissionSchema.safeParse({...full,phone:'abcdefg'}).success,false);});
test('role, owner and status injection are rejected',()=>{for(const key of ['role','user_id','status'])assert.equal(submissionSchema.safeParse({...full,[key]:'admin'}).success,false);});
test('only drafts/corrections editable and submitted dossier reviewable',()=>{for(const s of ['draft','needs_changes','submitted','accepted','rejected'] as const){assert.equal(mayEdit(s),['draft','needs_changes'].includes(s));assert.equal(mayReview(s),s==='submitted');}});
