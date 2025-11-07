indir<-"/Users/jen/Documents/temp"

input_prefix <- "E4412_tcr_20210902T+.[0-9]+_"

#list all files in the directory that end in .tsv
fileList <- list.files(indir,pattern="*.tsv")

chgName<-function(eachName){
  file.rename(from=eachName,to=sub(pattern=input_prefix,replacement="",eachName))
}

sapply(paste(indir,fileList,sep="/"),chgName)
