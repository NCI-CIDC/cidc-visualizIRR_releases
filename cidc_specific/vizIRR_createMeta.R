# program to generate a blank meta.csv sheet for a set of samples in a bucket.
# meta.csv will just have a list of sample names.
library(stringr,tidyr)

indir<-"/Users/jen/Dropbox/TCR_Concordance/concord_data"
out_file<-"/Users/jen/Dropbox/TCR_Concordance/practice_meta/meta.csv"

#create empty dataframe
sampleName_df<-data.frame()

#set counter
i=0

ffs=dir(indir,full.names=T)
for(ff in ffs){
  
  # process only files with a tsv extension
  
  if(length(grep('\\.tsv',ff))==0 ) next
  
  i=i+1
  # get file name without rest of path
  ff0=unlist(strsplit(ff,'\\/'))
  ff0=ff0[length(ff0)]
  
  # get rid of ".tsv"
  ff1<-str_sub(ff0,1,(length(ff0)-6))
  
  sampleName_df[i,1]<-ff1
}

colnames(sampleName_df)<-"sample"
write.table(sampleName_df,out_file,row.names=FALSE,sep=",")
  
  
  
  