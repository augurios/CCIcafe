<?php
print_r($_POST);
// nos  conectamos a ejemplo.com y al puerto 3307
$enlace = mysql_connect('dbwebymovil.cysmidruxrrl.us-west-2.rds.amazonaws.com',  'usrIngafta', '6s3r1nG@fta');
if  (!$enlace) {
    die('No pudo conectarse: ' . mysql_error());
}
mysql_select_db('ingafta'); 

$data = $_POST['info']['preguntas'];
$frmData = serialize($data);
$arrFecha = getdate();
$arrCampos = array();
$arrVals = array();
$arrPreguntas=array();
$arrRecomendaciones = array();
$arrRecomiendaTxt = array();
foreach($data as $piecedata){
    $campo = $piecedata['name'];
    $valor = $piecedata['value'];
    if(strpos(" ".$campo,"pregunta[")>0){
        $num = str_replace("[","",str_replace("]","",str_replace("pregunta","",$campo))); 
        $arrPreguntas[$num]=$valor;
    }else if(strpos(" ".$campo,"recomendacion_[")>0){
        $num = str_replace("[","",str_replace("]","",str_replace("recomendacion_","",$campo)));
        $arrRecos = @$arrRecomendaciones[$num];
        if(!is_array($arrRecos)){
            $arrRecos=array();
        }
        array_push($arrRecos,$valor);
        $arrRecomendaciones[$num]=$arrRecos;
    }else if(strpos(" ".$campo,"recomendaciones[")>0){
        $num = str_replace("[","",str_replace("]","",str_replace("recomendaciones","",$campo))); 
        $arrRecomiendaTxt[$num]=$valor;
    }
    else{ 
        array_push($arrCampos,$campo);
        array_push($arrVals,$valor);
    }
} 
$valpreguntas= serialize($arrPreguntas);
$valrecomendaciones=serialize($arrRecomendaciones);
$valrecomiendatxt=serialize($arrRecomiendaTxt);
$fecha = $arrFecha['year']."-".$arrFecha['mon']."-".$arrFecha['mday']." ".$arrFecha['hours'].":".$arrFecha['minutes'];
$consulta = "INSERT INTO encuestas_2(".implode(",",$arrCampos).",preguntas,recomendaciones,comentarios) VALUES('".implode("','",$arrVals)."','".$valpreguntas."','".$valrecomendaciones."','".$valrecomiendatxt."')"; 

$resultado = mysql_query($consulta); 

if (!$resultado) {
    $mensaje  = 'Consulta no válida: ' . mysql_error() . "\n";
    $mensaje .= 'Consulta completa: ' . $consulta;
    die($mensaje);
}

/*while ($fila = mysql_fetch_assoc($resultado)) {
    echo $fila['nombre'];
    echo $fila['apellido'];
    echo $fila['direccion'];
    echo $fila['edad'];
}*/

mysql_close($enlace);
?>