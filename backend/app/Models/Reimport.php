<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reimport extends Model
{
    use HasFactory;

    use SoftDeletes;

    protected $fillable = ['report_date','file_name','unique_name', 'file_url','notes','total_claims','reimport_by','claims_processed','status'];

}
