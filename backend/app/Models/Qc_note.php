<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Qc_note extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'qc_notes';


    protected $casts = [
        'options' => 'json',
    ];

    protected $fillable = [
        'claim_id','state','content','root_cause','error_type','error_parameter','error_sub_parameter','fyi_parameter','fyi_sub_parameter','created_by'
    ];

    public function root() {
        return $this->belongsTo('App\Models\Root_cause', 'root_cause', 'id');
    }

    public function error_types() {
        return $this->belongsToJson('App\Models\Error_type', 'options->error_types[]->error_type', 'id');
    }

}
