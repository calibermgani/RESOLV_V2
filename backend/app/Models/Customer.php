<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $connection = 'mysql2';
    protected $fillable = [
        'customer_name','short_name','customer_desc','contact_person','email','addressline1','addressline2','city','state','zipcode5','zipcode4','phone','phoneext','mobile','status','created_by','updated_by','updated_at'
    ];
}
