"""
Upload hanlders for content uploading

These handlers provide support for upload progress bars and
calculating sha-1 checksum on the fly
"""
from hashlib import sha1

from django.core.files.uploadhandler import MemoryFileUploadHandler

class ContentUploadHandler(MemoryFileUploadHandler):
    """Tracks uploading of content files and calculates hash for the file.

    This uploadhandler calculates the sha-1 hash for the file while it 
    is uploaded. If HTTP POST request headers contain query parameter 'X-Progress-ID' then
    also the upload status is tracked.
    """

    def __init__(self, request=None):
        """Initialize."""
        super(ContentUploadHandler, self).__init__(request)
        self.sha = sha1()
        self.progress_id = None
        self.chunk_size = 64 * 2 ** 10

    def handle_raw_input(self, input_data, META, content_length, boundary, encoding=None):
        """Customi initialization of the content upload."""
        self.content_length = content_length
        if 'X-Progress-ID' in self.request.GET:
            self.progress_id = self.request.GET['X-Progress-ID']
        else:
            #for debugging
            self.progress_id = 1
        if not 'REMOTE_ADDR' in  self.request.META.keys():
            self.request.META['REMOTE_ADDR'] = r'127.0.0.1'
        
    def receive_data_chunk(self, raw_data, start):
        """
        Handle chunk of uploaded data.
        Calculates sha-1 for the chunk and uploads file upload stats
        """
        # for simulating slow uploading, uncomment following line
        #import  time; time.sleep(0.5)
        self.sha.update(raw_data)
        return raw_data

    def file_complete(self, file_size):
        """Not needed. Called by the framerwork."""
        pass

    def new_file(self, field_name, file_name, content_type, content_length, charset=None):
        """Not needed. Called by the framerwork."""
        pass

    def upload_complete(self):
        """
        Called then the upload is done.
        """
        pass

