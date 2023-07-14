<?php
namespace App\Helpers;
use App\Models\Claim_history;

class Record_claim_history{

    public static function create_history($claim_data){
        foreach($claim_data as $claim)
        {
            $file_upload=Claim_history::create(
                [
                    'claim_id'         => $claim['claim_no'],
                    'claim_state'      => $claim['state'],
                    'assigned_by'      => $claim['assigned_by'],
                    'assigned_to'      => $claim['assigned_to']
                ]);
        }
        return $file_upload;
    }
}
