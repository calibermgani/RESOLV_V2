<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AutoCloseClaimModel extends Model
{
    use HasFactory;

    use SoftDeletes;

    protected $fillable = ['claim_no','acct_no','import_by','file_name','file_url','auto_close_date'];
}
